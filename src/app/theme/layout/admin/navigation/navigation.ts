export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  roles?: string[];

  children?: NavigationItem[];
}
export const NavigationItems: NavigationItem[] = [
  {
    id: 'navigation',
    title: 'Navigation',
    type: 'group',
    icon: 'icon-navigation',
    roles: ['admin', 'agent'],
    children: [
      {
        id: 'agent-details',
        title: 'Agent Details',
        type: 'item',
        url: '/agent-details',
        icon: 'feather icon-home',
        classes: 'nav-item',
        roles: ['agent']
      },
      {
        id: 'agent-dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/agent-dashboard',
        icon: 'feather icon-home',
        classes: 'nav-item',
        roles: ['agent']
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/dashboard',
        icon: 'feather icon-home',
        classes: 'nav-item',
        roles: ['admin']
      },
      {
        id: 'transactions',
        title: 'Transactions',
        type: 'item',
        url: '/transactions',
        icon: 'feather icon-credit-card',
        classes: 'nav-item',
        roles: ['agent']
      },
      {
        id: 'add-balance',
        title: 'Add Balance',
        type: 'item',
        url: '/add-balance',
        icon: 'feather icon-plus',
        roles: ['admin', 'agent']
      }
    ]
  }
];
