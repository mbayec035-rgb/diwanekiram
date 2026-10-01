/* Navigation latérale (bureau) et barre basse (mobile). */

import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
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
                    <motion.span
                      layoutId="sidenav-active"
                      className="sidenav-marker"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
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
                    <motion.span
                      layoutId="tabbar-active"
                      className="tabbar-dot"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    />
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