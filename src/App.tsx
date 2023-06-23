import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import routeConfig from './router';

declare module '@mui/material/styles' {
  interface PaletteOptions {
    Rejected: PaletteOptions['primary'];
    Approved: PaletteOptions['primary'] & PaletteOptions['secondary'];
  }
}

const theme = createTheme({
  typography: {
    fontFamily: "'Nunito', sans-serif",
  },
  palette: {
    Rejected: {
      main: "#E25C22",
      contrastText: "#FFDBCB",
    },
    Approved: {
      main: "#0B7F99",
      contrastText: "#CDEAF0",
      light: "#10EBA9",
    }
  },
});

const router = createBrowserRouter(
  routeConfig,
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
export default App;
