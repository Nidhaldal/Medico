import { AppMenuItem } from "./app-menu-item.model";
export const MENU_ITEMS: AppMenuItem[] = [
  // ------------------ MAIN ------------------
  {
    title: 'Main',
    icon: 'shopping-cart-outline',
    link: '/pages/dashboard',
    home: true,
    roles: ['admin', 'doctor', 'patient', 'prothesist'],
  },
  {
    title: 'Medical Community',
    icon: 'home-outline',
    link: '/pages/iot-dashboard',
    roles: ['admin', 'doctor', 'patient', 'prothesist'],
  },
  {
    title: 'My Pages',
    group: true,
    roles: ['admin'], // Only admin sees this group
  },

  // ------------------ Appointments ------------------
  {
    title: 'Appointments',
    icon: 'calendar-outline',
    link: '/pages/appointments',
    roles: ['admin', 'doctor', 'patient', 'prothesist'],
  },

  // ------------------ FEATURES ------------------
  {
    title: 'FEATURES',
    group: true,
    roles: ['admin'],
  },
  {
    title: 'Layout',
    icon: 'layout-outline',
    roles: ['admin'],
    children: [
      { title: 'Stepper', link: '/pages/layout/stepper', roles: ['admin'] },
      { title: 'List', link: '/pages/layout/list', roles: ['admin'] },
      { title: 'Infinite List', link: '/pages/layout/infinite-list', roles: ['admin'] },
      { title: 'Accordion', link: '/pages/layout/accordion', roles: ['admin'] },
      { title: 'Tabs', pathMatch: 'prefix', link: '/pages/layout/tabs', roles: ['admin'] },
    ],
  },
  {
    title: 'Forms',
    icon: 'edit-2-outline',
    roles: ['admin'],
    children: [
      { title: 'Form Inputs', link: '/pages/forms/inputs', roles: ['admin'] },
      { title: 'Form Layouts', link: '/pages/forms/layouts', roles: ['admin'] },
      { title: 'Buttons', link: '/pages/forms/buttons', roles: ['admin'] },
      { title: 'Datepicker', link: '/pages/forms/datepicker', roles: ['admin'] },
    ],
  },
  {
    title: 'UI Features',
    icon: 'keypad-outline',
    roles: ['admin'],
    children: [
      { title: 'Grid', link: '/pages/ui-features/grid', roles: ['admin'] },
      { title: 'Icons', link: '/pages/ui-features/icons', roles: ['admin'] },
      { title: 'Typography', link: '/pages/ui-features/typography', roles: ['admin'] },
      { title: 'Animated Searches', link: '/pages/ui-features/search-fields', roles: ['admin'] },
    ],
  },
  {
    title: 'Modal & Overlays',
    icon: 'browser-outline',
    roles: ['admin'],
    children: [
      { title: 'Dialog', link: '/pages/modal-overlays/dialog', roles: ['admin'] },
      { title: 'Window', link: '/pages/modal-overlays/window', roles: ['admin'] },
      { title: 'Popover', link: '/pages/modal-overlays/popover', roles: ['admin'] },
      { title: 'Toastr', link: '/pages/modal-overlays/toastr', roles: ['admin'] },
      { title: 'Tooltip', link: '/pages/modal-overlays/tooltip', roles: ['admin'] },
    ],
  },
  {
    title: 'Extra Components',
    icon: 'message-circle-outline',
    roles: ['admin'],
    children: [
      { title: 'Calendar', link: '/pages/extra-components/calendar', roles: ['admin'] },
      { title: 'Progress Bar', link: '/pages/extra-components/progress-bar', roles: ['admin'] },
      { title: 'Spinner', link: '/pages/extra-components/spinner', roles: ['admin'] },
      { title: 'Alert', link: '/pages/extra-components/alert', roles: ['admin'] },
      { title: 'Calendar Kit', link: '/pages/extra-components/calendar-kit', roles: ['admin'] },
      { title: 'Chat', link: '/pages/extra-components/chat', roles: ['admin'] },
    ],
  },
  {
    title: 'Maps',
    icon: 'map-outline',
    roles: ['admin'],
    children: [
      { title: 'Google Maps', link: '/pages/maps/gmaps', roles: ['admin'] },
      { title: 'Leaflet Maps', link: '/pages/maps/leaflet', roles: ['admin'] },
      { title: 'Bubble Maps', link: '/pages/maps/bubble', roles: ['admin'] },
      { title: 'Search Maps', link: '/pages/maps/searchmap', roles: ['admin'] },
    ],
  },
  {
    title: 'Charts',
    icon: 'pie-chart-outline',
    roles: ['admin'],
    children: [
      { title: 'Echarts', link: '/pages/charts/echarts', roles: ['admin'] },
      { title: 'Charts.js', link: '/pages/charts/chartjs', roles: ['admin'] },
      { title: 'D3', link: '/pages/charts/d3', roles: ['admin'] },
    ],
  },
  {
    title: 'Editors',
    icon: 'text-outline',
    roles: ['admin'],
    children: [
      { title: 'TinyMCE', link: '/pages/editors/tinymce', roles: ['admin'] },
      { title: 'CKEditor', link: '/pages/editors/ckeditor', roles: ['admin'] },
    ],
  },
  {
    title: 'Tables & Data',
    icon: 'grid-outline',
    roles: ['admin'],
    children: [
      { title: 'Smart Table', link: '/pages/tables/smart-table', roles: ['admin'] },
      { title: 'Tree Grid', link: '/pages/tables/tree-grid', roles: ['admin'] },
    ],
  },
  {
    title: 'AI Assistance',
    icon: 'shuffle-2-outline',
    roles: ['admin', 'doctor', 'patient', 'prothesist'],
    children: [
      { title: 'Image Capture', link: '/pages/miscellaneous/404', roles: ['admin', 'doctor', 'patient', 'prothesist'] },
    ],
  },
];
