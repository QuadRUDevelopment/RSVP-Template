import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { DocumentHead } from './components/layout/DocumentHead/DocumentHead';
import './App.css';

function App() {
  return (
    <>
      <DocumentHead />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
