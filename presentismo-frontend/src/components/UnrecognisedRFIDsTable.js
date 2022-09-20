import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Button, CircularProgress, Input, Modal, Tooltip } from '@mui/material';

export default function UnrecognisedRFIDsTable({ ids, refreshData }) {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [rfid, setRfid] = useState('');
  const [httpStatus, setHttpStatus] = useState();
  const [errorMessage, setErrorMessage] = useState('');
  const [existingUser, setExistingUser] = useState('');
  const [isLoading, setIsloading] = useState(false);

  const handleBtnClick = () => {
    setIsloading(true);
    fetch('/addUser', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfid,
        userName
      })
    }).then(res => {
      setHttpStatus(res.status);
      return res.json();
    })
      .then(res => {
        if (res.existingUser) {
          setExistingUser(res.existingUser[0].userName)
        }
      })
      .finally(() => { setIsloading(false) })
  }


  useEffect(() => {
    if (httpStatus) {
      switch (httpStatus) {
        case 422:
          setErrorMessage(`Ya hay un usuario con ese rfid bajo el nombre: "${existingUser}"`);
          break;
        case 201:
          setRfid();
          setErrorMessage();
          refreshData();
          toggleModal();
          break;
        default:
          setErrorMessage(`Oops! Hubo un error`);
      }
    }
  }, [httpStatus])

  const handleInputChange = (e) => {
    setUserName(e.target.value);
  }

  const toggleModal = (selectedRfid) => {
    if (selectedRfid) {
      setRfid(selectedRfid);
    }
    setIsModalOpen(!isModalOpen);
  }

  const renderModal = () => (
    <Modal open={isModalOpen} onClose={toggleModal}>
      <Paper className='modal'>
        <div className='modal__input'>
          <div>Indique el nombre</div>
          <Input value={userName} placeholder='Nombre' onChange={handleInputChange}></Input>
        </div>
        {errorMessage && <p className='modal__error'>{errorMessage}</p>}
        {isLoading ? <CircularProgress className='modal__button' /> : <Button className='modal__button' onClick={handleBtnClick}>Enviar</Button>}
      </Paper>
    </Modal>
  )

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Rfid</TableCell>
            <TableCell align="right">Hora</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ids.map((row) => (
            <TableRow
              key={`${row.rfid}`}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                <Tooltip title={"Dar de alta"} arrow>
                  <Button onClick={() => { toggleModal(row.rfid) }}>{row.rfid}</Button>
                </Tooltip>
                {renderModal()}
              </TableCell>
              <TableCell align="right">{row.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
