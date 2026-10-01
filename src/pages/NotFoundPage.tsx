/* Page 404. */

import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { motion } from 'framer-motion'
import { EmptyState } from '../components/ui/Bits'

export function NotFoundPage() {
  return (
    <div className="page-stack page-stack--centered">
      <motion.p
        className="notfound-code"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        404
      </motion.p>
      <EmptyState
        icon={<Compass size={22} />}
        title="Cette page n'existe pas"
        description="Le verset que vous cherchez a peut-être changé de chemin."
        action={{ to: '/', label: "Retour à l'accueil" }}
      />
      <Link className="muted small" to="/bibliotheque">
        Ou parcourez la bibliothèque
      </Link>
    </div>
  )
}