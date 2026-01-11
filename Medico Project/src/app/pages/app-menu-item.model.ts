import { NbMenuItem } from '@nebular/theme';

export interface AppMenuItem extends NbMenuItem {
  roles?: string[]; // optional: specify which roles can see this item
  children?: AppMenuItem[]; // override to allow nested items with roles
}
