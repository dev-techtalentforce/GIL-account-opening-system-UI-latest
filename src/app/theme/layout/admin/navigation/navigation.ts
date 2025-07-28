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
    title: 'GAOS',
    type: 'group',
    icon: 'icon-navigation',
    roles: ["Admin", 'Agent'],
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/dashboard',
        icon: 'feather icon-home',
        classes: 'nav-item',
        roles: ["Admin"]
      },
      {
        id: 'agent-details',
        title: 'Agent Details',
        type: 'item',
        url: '/agent-dashboard',
        icon: 'feather icon-user',
        classes: 'nav-item',
        roles: ['Agent']
      },
      {
        id: 'add-balance',
        title: 'Add Balance',
        type: 'item',
        url: '/add-balance',
        icon: 'feather icon-plus',
        roles: [ 'Agent']
      },
      {
        id: 'nsdl-registration',
        title: 'NSDLRegistration',
        type: 'item',
        url: '/agentRegistration',
        icon: 'feather icon-user-plus',
        roles: ['Agent']
      },
      {
        id: 'account-open',
        title: 'AccountOpen',
        type: 'item',
        url: '/account-open',
        icon: 'feather icon-briefcase',
        roles: ['Agent']
      }
    ]
  }
];
