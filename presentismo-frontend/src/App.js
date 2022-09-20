import { useEffect, useState } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { Button, CircularProgress, Paper, TextField } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

import './App.css';
import UsersTable from './components/UsersTable';
import UnrecognisedRFIDsTable from './components/UnrecognisedRFIDsTable';

function App() {
  const [date, setDate] = useState(new Date())
  const [userTable, setUserTable] = useState([]);
  const [unrecognisedRFIDs, setUnrecognisedRFIDs] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchApi = () => {
    const dateString = date.toISOString().split('T')[0];
    setIsFetching(true);
    fetch(`/getDailyUserTable?date=${dateString}`)
      .then(res => res.json())
      .then(({ userTable, unrecognisedRFIDs }) => {
        setUserTable(userTable);
        setUnrecognisedRFIDs(unrecognisedRFIDs);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }

  useEffect(() => {
    console.log("fetching from database");
    fetchApi();
    // setInterval(fetchApi, 5000);
  }, [date]);

  const handleDateChange = (newValue) => {
    setDate(newValue);
  }

  return (
    <div className="App">
      <Paper className='date__container'>
        <div className='date__label'>
          Seleccione Fecha:
        </div>
        <div className='date__input'>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label="Fecha"
              value={date}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </div>
        <div className='date__spinner'>
          {isFetching ?
            <CircularProgress /> :
            <Button onClick={fetchApi}><RefreshIcon /></Button>
          }</div>
      </Paper>
      <div className='data__container'>
        <div className='data__users'><UsersTable users={userTable} /></div>
        {!unrecognisedRFIDs.length ?
          <Paper className='data__unknown data__unknown--empty'>No hay RFID desconocidos en esta fecha</Paper> :
          <div className='data__unknown'><UnrecognisedRFIDsTable ids={unrecognisedRFIDs} refreshData={fetchApi} /></div>}
      </div>
    </div>
  );
}

export default App;
