import React, { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { HeartIcon } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const Community = () => {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const { getToken } = useAuth()

  const fetchCreations = async () => {
    try {
      const { data } = await axios.get(
        '/api/user/get-published-creations',
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )
      if (data.success) {
        setCreations(data.creations)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  const imageLikeToggle = async (id) => {
    try {
      const { data } = await axios.post(
        '/api/user/toggle-like-creation',
        { id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (data.success) {
        toast.success(data.message)
        fetchCreations()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (user) fetchCreations()
  }, [user])

  return (
    <div className="flex-1 h-full flex flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Creations</h1>

      <div className="bg-white h-full w-full rounded-xl overflow-y-scroll p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creations.map((creation) => {
            const likes = creation.likes || []

            return (
              <div key={creation.id} className="relative group rounded-lg overflow-hidden">
                <img src={creation.content} alt={creation.prompt} className="w-full h-full object-cover"/>

                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-transparent to-black/80 opacity-0 group-hover:opacity-100 transition p-3 text-white">
                  <p className="text-sm mb-2">{creation.prompt}</p>

                  <div className="flex items-center gap-2">
                    <p className="text-sm">{likes.length}</p>

                    <HeartIcon onClick={() => imageLikeToggle(creation.id)}className={`w-5 h-5 cursor-pointer transition hover:scale-110
                        ${
                          likes.includes(user?.id?.toString())
                            ? 'fill-red-500 text-red-500'
                            : 'text-white'
                        }`}/>
                  </div>
                </div>
              </div>
            )})}
        </div>
      </div>
    </div>
  )
}

export default Community