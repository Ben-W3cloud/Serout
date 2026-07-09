import { RouteOption } from '../../types/route';
import { RouteCard } from './RouteCard';

interface Props {
  routes: RouteOption[];
  onSelect: (route: RouteOption) => void;
  disabled?: boolean;
}

export function RouteSelector({ routes, onSelect, disabled = false }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 mb-1">
      {routes.map((route, index) => (
        <RouteCard
          key={route.id}
          route={route}
          index={index}
          onSelect={onSelect}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
