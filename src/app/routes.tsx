import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout/AdminLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute/ProtectedRoute';
import { Home } from '../pages/Home/Home';
import { RSVP } from '../pages/RSVP/RSVP';
import { Accommodation } from '../pages/Accommodation/Accommodation';
import { Venue } from '../pages/Venue/Venue';
import { Menu } from '../pages/Menu/Menu';
import { Schedule } from '../pages/Schedule/Schedule';
import { Login } from '../pages/admin/Login/Login';
import { Dashboard } from '../pages/admin/Dashboard/Dashboard';
import { Guests } from '../pages/admin/Guests/Guests';
import { Accommodation as AdminAccommodation } from '../pages/admin/Accommodation/Accommodation';
import { Menu as AdminMenu } from '../pages/admin/Menu/Menu';
import { Timeline } from '../pages/admin/Timeline/Timeline';
import { Gallery } from '../pages/admin/Gallery/Gallery';
import { Settings } from '../pages/admin/Settings/Settings';
import { Groups } from '../pages/admin/Groups/Groups';
import { CustomFields } from '../pages/admin/CustomFields/CustomFields';
import { GiftRegistry } from '../pages/GiftRegistry/GiftRegistry';
import { GiftRegistry as AdminGiftRegistry } from '../pages/admin/GiftRegistry/GiftRegistry';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <div style={{ padding: '2rem', textAlign: 'center' }}><h1>Something went wrong</h1><p>Please try refreshing the page.</p></div>,
    children: [
      { index: true, element: <Home /> },
      { path: 'rsvp', element: <RSVP /> },
      { path: 'accommodation', element: <Accommodation /> },
      { path: 'venue', element: <Venue /> },
      { path: 'menu', element: <Menu /> },
      { path: 'schedule', element: <Schedule /> },
      { path: 'gift-registry', element: <GiftRegistry /> },
    ],
  },
  {
    path: '/admin',
    children: [
      { path: 'login', element: <Login /> },
      {
        path: '',
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'guests', element: <Guests /> },
          { path: 'accommodation', element: <AdminAccommodation /> },
          { path: 'menu', element: <AdminMenu /> },
          { path: 'timeline', element: <Timeline /> },
          { path: 'gallery', element: <Gallery /> },
          { path: 'groups', element: <Groups /> },
          { path: 'custom-fields', element: <CustomFields /> },
          { path: 'gift-registry', element: <AdminGiftRegistry /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },
]);
