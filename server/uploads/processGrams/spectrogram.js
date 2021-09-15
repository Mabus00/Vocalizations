
import canvas from 'canvas'; // https://github.com/Automattic/node-canvas
import fs from 'fs';
import util from 'util';
import colormap from 'colormap'; // https://www.npmjs.com/package/colormap
import path from "path";

import { dbConnection } from "../../mongoConnect.js";
import { singleFileUpload } from '../../controllers/files.js';

const __dirname = path.resolve();

const filePath = path.join(__dirname, 'uploads');

let colorMap = colormap({
    colormap: 'magma',
    nshades: 256,
    format: 'rba',
    alpha: 1
});

const transposeMatrix = (matrix) => {
    // matrix[0] to iterate over all the columns
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

// given an array return the max value
const getMax = (arr) => {
    let len = arr.length;
    let max = -Infinity;
    while (len--) {
        max = arr[len] > max ? arr[len] : max;
    }
    return max;
}
  
// given an array return the min value
const getMin = (arr) => {
    let len = arr.length;
    let min = Infinity;
    while (len--) {
        min = arr[len] < min ? arr[len] : min;
    }
    return min;
}

const mapToRGBRange = (specData) => {
    //normalizing between 0-1
    const min = getMin(specData)
    specData = specData.map(element => element - min);
    const max = getMax(specData)
    specData = specData.map(element => element / max);
    //scaling to 0-255
    specData = specData.map(element => element * 255);
    const uintArray = new Uint8ClampedArray(specData);
    return uintArray;
}

const getRGBvalue = (value) => {
    return colorMap[value];
}

const processSpecFile = (filePath) => {
    fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        const JSONdata = JSON.parse(data);
        spectrogram(JSONdata, filePath);
    });
}

const spectrogram = (specData, filePath) => {
     
    const freqAxisHeight = specData.data[0].length; // number of freq bins; each bin = 1 px
    const timeAxisWidth = specData.data.length; // number of time bins; each bin = 1 

    const specCanvas = canvas.createCanvas(timeAxisWidth, freqAxisHeight);
    const canvasContext = specCanvas.getContext('2d');

    /** specData[time bins, frequency bins]
        The origin is always at the top left corner:
            0                  on reverse: #time bins         on transpose:   0
            |--> #freq bins                |-->#freq bins                     |--> #time bins
            v                              v                                  v
        #time bins                         0                             #freq bins 
    */
    const transformedData = transposeMatrix(specData.data.reverse());

    // flat() starts at the last element in the array (i.e., [129][300], [129][299], [129, 298], etc.)
    // so reverse() gets the data points in proper order from origin (i.e., [0][0], [0][1], [0][2], etc.)
    const mappedData = mapToRGBRange(transformedData.flat().reverse());

    const imgData = canvasContext.createImageData(timeAxisWidth, freqAxisHeight);

    for (var i = 0; i < imgData.data.length/4; i++) {
        let rgbValues = getRGBvalue(mappedData[i]);
        imgData.data[4*i] = rgbValues[0]; 
        imgData.data[4*i+1] = rgbValues[1]; 
        imgData.data[4*i+2] = rgbValues[2]; 
        imgData.data[4*i+3] = 255; 
    }

    canvasContext.putImageData(imgData, 0, 0);

    const writeFile = util.promisify(fs.writeFile);
    
    const writeFileContent = async (path, data) => {
        await writeFile(path, data);
    }

    const fetchMongoRecord = async (value) => {
        // .findOneAndUpdate() returns a cursor to the documents that match the query criteria.
        const base64 = "data:image/png;base64," + value;
        const relativeFilePath = filePath.replace(__dirname, "").substring(1);
        try {
            const document = await dbConnection.collections.postmessages.findOneAndUpdate( 
                { "filePath" : relativeFilePath },
                { $set: { selectedFile: base64 } }
            );
        } catch (error) {
            console.log(error);
        }
    }

    specCanvas.toBuffer((err, buffer) => {
        if (err) throw err // encoding failed
        let path = './image.png';
        writeFileContent(path, buffer)
        .then( () => {
            const buf = new Buffer.from(buffer);
            const base64 = buf.toString('base64');
            fetchMongoRecord(base64, filePath);
        })
        .catch(err => {
            console.log(`\nError Occurs, 
            Error code -> ${err.code},
            Error NO -> ${err.errno}`)
        });
    });

}

export default processSpecFile;