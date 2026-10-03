/* Page 404. */

import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/ui/Bits'

export function NotFoundPage() {
  return (
    <div className="page-stack page-stack--centered">
      <p className="notfound-code">
        404
      </p>
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