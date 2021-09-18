import React, { useState } from 'react';
import { AppBar, Typography, Button, CircularProgress } from '@material-ui/core';
import { singleFileUpload } from '../../actions/posts';
import { useDispatch } from 'react-redux';

// import Modal from 'react-modal';

import useStyles from './styles';

// Modal.setAppElement('#root');

const Upload = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const [singleFile, setSingleFile] = useState('');
  const [singleProgress, setSingleProgress] = useState(0);
  // const [modalIsOpen, setModalIsOpen] = useState(false);

  const SingleFileChange = (e) => {
    setSingleFile(e.target.files[0]);
    setSingleProgress(0);
  }

  const singleFileOptions = {
    onUploadProgress: (progressEvent) => {
        const {loaded, total} = progressEvent;
        const percentage = Math.floor(((loaded / 1000) * 100) / (total / 1000));
        setSingleProgress(percentage);
    }
  }

  const uploadSingleFile = () => {
    const formData = new FormData(); // uses same format a form would use if the encoding type were set to "multipart/form-data"
    formData.append('file', singleFile);
    dispatch(singleFileUpload(formData, singleFileOptions));

    // if (response.status === 201) {
    //   setModalIsOpen(true);
    // } else {
    //   alert(response.data);
    // }
  }

  // const processFile = async () => {
  //   console.log('server process file ', singleFile);
  //   setModalIsOpen(false);
  // }

  return (
    <AppBar className={classes.appBar} position="static" color="inherit">
        <Typography className={classes.heading} variant="h6" align="center">Upload Vocalization File</Typography>
        <div className={classes.fileInput}>
          <div className="form-group">
              <input type="file" className="form-control" onChange={(e) => SingleFileChange(e)} />
          </div>
        </div>
        <Button
          className={classes.buttonSubbmit}
          variant="contained"
          color="primary"
          size="large"
          type="submit"
          onClick={() => uploadSingleFile()}
        >
          Upload
        </Button>
        {/* <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          style={{
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'grey'
          },
          content: {
            position: 'absolute',
            width: '20%',
            height: '20%',
            top: '40%',
            left: '40%',
            border: '1px solid #ccc',
            background: '#fff',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            borderRadius: '4px',
            outline: 'none',
            padding: '20px'
          }
        }}
          >
          <h2>File successfully uploaded to server. Do you want to process your data now?</h2>
          <div>
            <button onClick={() => processFile()}>Yes</button>
            <button onClick={() => setModalIsOpen(false)}>No</button>
          </div>
        </Modal> */}
        <CircularProgress variant="determinate" value={singleProgress} />
    </AppBar>
  );
};

export default Upload;