import React, { useState, useEffect } from 'react';
import { Button, TextField, Grid, Paper, LinearProgress, Typography } from '@mui/material';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import io from 'socket.io-client';

const ScraperDashboard = () => {
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isScrapingComplete, setIsScrapingComplete] = useState(true);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
          console.log('Fetching companies...');
          const response = await axios.get('http://localhost:3000/data');
          console.log('Companies fetched:', response.data);
          const companiesWithId = response.data.map((company, index) => ({
            ...company,
            id: index,
          }));
          setCompanies(companiesWithId);
          setFilteredCompanies(companiesWithId);
        } catch (error) {
          console.error('Error fetching companies:', error);
          alert('Error fetching companies data');
        } finally {
          setIsLoading(false);
        }
      };

    useEffect(() => {
        fetchCompanies();
        const socket = io('http://localhost:3000', {
            withCredentials: true,
        });
        socket.on('progress', (progress) => {
            setProgress(progress);
            if (progress === 100) {
                setIsScrapingComplete(true);
                fetchCompanies();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleSearch = () => {
        const filtered = companies.filter(
          (company) =>
            company.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.Address.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCompanies(filtered);
    };
    const handleScrape = async () => {
        setIsLoading(true);
        setIsScrapingComplete(false);
        setProgress(0);
        try {
            await axios.post('http://localhost:3000/data/trigger-scraping');
        } catch (error) {
            console.error('Error during scraping process:', error);
            alert('Error during scraping process');
        } finally {
            setIsLoading(false);
        }
    };
    // const handleScrape = async () => {
    //     setIsLoading(true);
    //     setIsScrapingComplete(false);
    //     setProgress(0);
    //     try {
    //         await axios.post('http://localhost:3000/data/trigger-scraping');
    //         const progressInterval = setInterval(async () => {
    //             const progressResponse = await axios.get('http://localhost:3000/data/scraping-progress');
    //             setProgress(progressResponse.data.progress);
    //             if (progressResponse.data.progress === 100) {
    //                 clearInterval(progressInterval);
    //                 setIsScrapingComplete(true);
    //                 await fetchCompanies();
    //             }
    //         }, 1000); // Poll every second
            
    //     } catch (error) {
    //         console.error('Error during scraping process:', error);
    //         alert('Error during scraping process');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleDropDatabase = async () => {
        setIsLoading(true);
        try {
            await axios.delete('http://localhost:3000/data');
            alert('Database collection dropped successfully');
            setCompanies([]);
            setFilteredCompanies([]);
        } catch (error) {
            console.error('Error dropping database:', error);
            alert('Error dropping database collection');
        } finally {
            setIsLoading(false);
        }
    };

    const columns = [
        { field: 'Title', headerName: 'Title', width: 200 },
        { field: 'Phone', headerName: 'Phone', width: 150 },
        { field: 'Fax', headerName: 'Fax', width: 150 },
        { field: 'Website', headerName: 'Website', width: 200 },
        { field: 'Address', headerName: 'Address', width: 300 },
        { field: 'Activity', headerName: 'Activity', width: 200 },
        { field: 'Manager', headerName: 'Manager', width: 200 },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Grid container spacing={2} alignItems="center" style={{ marginBottom: '20px' }}>
                <Grid item>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleScrape}
                        disabled={isLoading || !isScrapingComplete}
                    >
                        {isLoading && !isScrapingComplete ? 'Scraping...' : 'Scrape'}
                    </Button>
                </Grid>
                <Grid item>
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={handleDropDatabase}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting collection...' : 'Drop database'}
                    </Button>
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Search by name or address"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Grid>
                <Grid item>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSearch}
                        disabled={isLoading}
                    >
                        Search
                    </Button>
                </Grid>
            </Grid>

            {!isScrapingComplete && (
                <div style={{ marginBottom: '20px' }}>
                    <Typography variant="body2" color="textSecondary">
                        Scraping Progress: {progress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} />
                </div>
            )}

            <Paper style={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredCompanies}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    checkboxSelection
                    disableSelectionOnClick
                    loading={isLoading}
                />
            </Paper>
        </div>
    );
};

export default ScraperDashboard;