import React from 'react'
import { NavLink } from 'react-router-dom'
import { useUser, useClerk, Protect } from '@clerk/clerk-react'
import { Eraser, Hash, House, SquarePen, Scissors, Image, User, FileText, LogOut, } from 'lucide-react'

const navItems = [
  { to: '/ai', label: 'Dashboard', Icon: House },
  { to: '/ai/write-article', label: 'Write Article', Icon: SquarePen },
  { to: '/ai/blog-titles', label: 'Blog Titles', Icon: Hash },
  { to: '/ai/generate-images', label: 'Generate Images', Icon: Image },
  { to: '/ai/remove-background', label: 'Remove Background', Icon: Eraser },
  { to: '/ai/remove-object', label: 'Remove Object', Icon: Scissors },
  { to: '/ai/review-resume', label: 'Review Resume', Icon: FileText },
  { to: '/ai/community', label: 'Community', Icon: User },
]

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()

  if (!user) return null

  return (
    <div
      className={`w-60 bg-white border-r border-gray-200
      flex flex-col
      max-sm:absolute top-14 bottom-0 z-40
      ${sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'}
      transition-all duration-300 ease-in-out`}>
      {/* User info */}
      <div className="my-7 text-center">
        <img
          src={user.imageUrl}
          alt="user avatar"
          className="w-12 h-12 rounded-full mx-auto"
        />
        <h1 className="mt-2 text-sm font-medium">{user.fullName}</h1>
      </div>
      {/* Navigation */}
      <nav className="px-6 mt-5 text-sm text-gray-600 font-medium space-y-1">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/ai'}
            onClick={() => setSidebar(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-1 py-2 rounded-lg text-base font-medium transition-colors
              ${
                isActive ? 'bg-gradient-to-r from-[#3c81F6] to-[#9234EA] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${ isActive ? 'text-white' : 'text-gray-500'}`}/>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Actions - stays at bottom */}
      <div className="mt-auto border-t border-gray-200 p-4 px-7 flex items-center justify-between">
        <button onClick={openUserProfile} className="flex items-center gap-2">
          <img src={user.imageUrl} className="w-8 h-8 rounded-full cursor-pointer" alt="user avatar"/>
        </button>

        <div className="flex-1 ml-3">
          <h1 className="text-sm font-medium">{user.fullName}</h1>
          <p className="text-xs text-gray-500">
            <Protect plan="premium" fallback="Free">
              Premium
            </Protect>{' '}
            Plan
          </p>
        </div>

        <button onClick={signOut} aria-label="Logout">
          <LogOut className="w-4 h-4 text-gray-400 hover:text-gray-700 transition" />
        </button>
      </div>
    </div>
  )
}

export default Sidebar
