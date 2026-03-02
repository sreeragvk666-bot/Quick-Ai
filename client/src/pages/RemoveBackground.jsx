import React, { useState } from 'react'
import { Eraser, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL; 

const RemoveBackground = () => {

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  
  const {getToken} = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try{
      setLoading(true)

      const formData = new FormData()
      formData.append('image', input)

      const {data} = await axios.post('/api/ai/remove-image-background', 
      formData,{headers: {Authorization: `Bearer ${await getToken()}`}})

      if(data.success) {
        setContent(data.content)
      } else{
        toast.error(data.message);
      }
    } catch (error){
       toast.error(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* FORM */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Background Remover</h1>
        </div>

        {/* Upload */}
        <p className="mt-6 text-sm font-medium">Upload Image</p>

      <label className={`w-full mt-2 flex items-center px-4 py-3 border rounded-md cursor-pointer text-sm transition
        ${input ? "border-green-400 bg-green-50 text-green-600" : "border-gray-300 bg-gray-50 text-gray-600"}`}>
      <span className="truncate">
        {input ? input.name : "Click to upload image"}
      </span>
      <input type="file" accept="image/*" onChange={(e) => setInput(e.target.files[0])} className="hidden" required/>
      </label>

      <p className="text-xs text-gray-500 font-light mt-1">Supports JPG, PNG, and other image formats</p>

        {/* Submit */}
        <button disabled={loading}
          type="submit"
          className="
            mt-6 w-full flex items-center justify-center gap-2
            bg-gradient-to-r from-[#F6AB41] to-[#FF4938]
            text-white py-2 px-4 rounded-lg text-sm hover:opacity-90 cursor-pointer transition"
        >
          {
            loading ? <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin" ></span> : <Eraser className="w-5 h-5" />
          }
          Remove Background
        </button>
      </form>

      {/* RESULT PANEL */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3">
          <Eraser className="w-5 h-5 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Processed Image</h1>
        </div>
        {
          !content ? (
            <div className="flex-1 flex items-center justify-center">
          <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
            <Eraser className="w-12 h-12" />
            <p className="italic">
              Your processed image will appear here.
            </p>
          </div>
        </div>
          ) : (
            <img src={content} alt="image" className='mt-3 w-full h-full' />
          )
        }
        
      </div>

    </div>
  )
}

export default RemoveBackground
