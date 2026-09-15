import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarBlank, ChartPieSlice, GearSix, Users } from '@phosphor-icons/react';

const tabs = [
  { to: '/', label: 'Agenda', icon: CalendarBlank },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/financeiro', label: 'Financeiro', icon: ChartPieSlice },
  { to: '/ajustes', label: 'Ajustes', icon: GearSix },
];

export default function Tabs() {
  const { pathname } = useLocation();

  return (
    <>
      <Outlet />
      <nav className="tabbar">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <NavLink key={to} to={to} end>
              <Icon size={24} weight={active ? 'fill' : 'regular'} />
              {label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
