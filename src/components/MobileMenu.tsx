import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface MobileMenuProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
  }>;
  isConnected: boolean;
}

export function MobileMenu({ navigation, isConnected }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-cyan-900/50 focus:outline-none "
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#112A45] border-b border-cyan-900/50 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    ${location.pathname === item.href
                      ? 'bg-cyan-900/50 text-white'
                      : 'text-gray-300 hover:bg-cyan-900/30 hover:text-white'
                    }
                    ${!isConnected 
                      ? 'pointer-events-none opacity-50' 
                      : 'cursor-pointer'
                    }
                    group flex items-center px-3 py-2 rounded-md text-base font-medium w-full
                  `}
                  onClick={(e) => {
                    if (!isConnected) {
                      e.preventDefault();
                    } else {
                      setIsOpen(false);
                    }
                  }}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}