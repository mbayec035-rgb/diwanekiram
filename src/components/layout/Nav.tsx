/* Navigation latérale (bureau) et barre basse (mobile). */

import { NavLink } from 'react-router-dom'
import { NAV_ENTRIES } from './navItems'

export function SideNav() {
  return (
    <nav className="sidenav" aria-label="Navigation principale">
      <ul>
        {NAV_ENTRIES.map((entry) => (
          <li key={entry.to}>
            <NavLink to={entry.to} end={entry.to === '/'} className="sidenav-link">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="sidenav-marker" />
                  )}
                  <entry.icon size={19} aria-hidden="true" />
                  <span>{entry.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function MobileTabBar() {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      <ul>
        {NAV_ENTRIES.map((entry) => (
          <li key={entry.to}>
            <NavLink to={entry.to} end={entry.to === '/'} className="tabbar-link">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="tabbar-dot" />
                  )}
                  <entry.icon size={20} aria-hidden="true" />
                  <span>{entry.short}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}