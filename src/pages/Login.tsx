import { FormEvent, useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import LeftArt from '../assets/Login/model.svg'
import Background from '../assets/Login/Background.svg'
import { loginUser } from '../Services/api'
import type { ApiError } from '../Services/api'
import { getFriends } from '../Services/friendshipApi'


interface LoginProps {
  onNavigate?: (view: 'landing' | 'signup') => void
}

const Login = ({ onNavigate }: LoginProps) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setError(message)
    }

    // Check if user already has a valid token
    const token = localStorage.getItem('jwt_token')
    if (token) {
      const validateToken = async () => {
        try {
          await getFriends(1)
          // Token is valid, redirect to chat
          navigate('/chat')
        } catch (error) {
          // Token is invalid, stay on login page
          // Clear invalid token
          localStorage.removeItem('jwt_token')
          localStorage.removeItem('user')
        }
      }
      validateToken()
    }
  }, [searchParams, navigate])

  const formatServerError = (apiError: ApiError) => {
    if (apiError.status === 401) {
      // Check the specific error message from backend
      const errorMsg = apiError.error?.toLowerCase() || ''
      if (errorMsg.includes('no user found')) {
        return 'No user with that username is found.'
      }
      if (errorMsg.includes('invalid user credentials')) {
        return 'Username or password is invalid.'
      }
      return 'Username or password is invalid.'
    }
    if (apiError.error) {
      const msg = apiError.error.trim()
      return msg.charAt(0).toUpperCase() + msg.slice(1)
    }
    return 'Something went wrong. Please try again.'
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const trimmedUsername = username.trim()
    const validationErrors: Record<string, string> = {}

    if (!trimmedUsername) {
      validationErrors.username = 'Username is required.'
    } else {
      if (trimmedUsername.length < 3 || trimmedUsername.length > 32) {
        validationErrors.username = 'Username must be 3-32 characters.'
      }
      if (!/^[a-zA-Z0-9]+$/.test(trimmedUsername)) {
        validationErrors.username = 'Username must be alphanumeric with no spaces.'
      }
    }

    if (!password) {
      validationErrors.password = 'Password is required.'
    } else if (password.length < 8 || password.length > 128) {
      validationErrors.password = 'Password must be 8-128 characters.'
    }

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors)
      setError('Please fix the highlighted fields.')
      return
    }

    setIsLoading(true)

    try {
      // Add a small delay to make the loading state visible and smoother
      await new Promise(resolve => setTimeout(resolve, 300))

      const response = await loginUser({
        username: trimmedUsername,
        password,
      })

      localStorage.setItem('jwt_token', response.token)

      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user))
      }

      // Small delay before navigation for smoother UX
      await new Promise(resolve => setTimeout(resolve, 200))
      navigate('/chat')
    } catch (err) {
      const apiError = err as ApiError
      if (apiError.fields) {
        setFieldErrors((prev) => ({ ...prev, ...apiError.fields }))
      }
      setError(formatServerError(apiError))
      // Input values are preserved in state, so they won't be lost
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className='min-h-screen bg-gray-50'>
      <div className='grid grid-cols-1 lg:grid-cols-2 min-h-screen'>
        {/* Left Section - Character Scene */}
        <section className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src={Background}
              alt="Background"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 flex items-center justify-center w-full h-full px-8">
            <img
              src={LeftArt}
              alt="3D Character"
              className="h-[85%] max-h-[700px] w-auto object-contain"
            />
          </div>
        </section>

        {/* Right Section - Login Form */}
        <section className='relative flex flex-col bg-gray-50'>
          <div className='flex-1 flex items-center justify-center px-6 py-12'>
            <div className='w-full max-w-md'>
              {/* Welcome Title */}
              <h1 className='text-4xl font-bold text-blue-600 mb-2'>
                Welcome Back, <span className='text-5xl'>Whirler!</span>
              </h1>
              <p className='text-sm text-gray-900 mb-8'>
                Pick up where you left off and jump right back into the conversation.
              </p>

              {/* Login Form */}
              <form className='space-y-5' onSubmit={handleSubmit}>
                {/* Username Field */}
                <div>
                  <label htmlFor='username' className='block text-sm font-medium text-gray-700 mb-1'>
                    Username
                  </label>
                  <input
                    id='username'
                    type='text'
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      setFieldErrors((prev) => ({ ...prev, username: '' }))
                    }}
                    className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder='Username'
                  />
                  {fieldErrors.username && (
                    <p className='mt-1 text-xs text-red-500'>{fieldErrors.username}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>
                    Password
                  </label>
                  <input
                    id='password'
                    type='password'
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setFieldErrors((prev) => ({ ...prev, password: '' }))
                    }}
                    className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder='Password'
                  />
                  {fieldErrors.password && (
                    <p className='mt-1 text-xs text-red-500'>{fieldErrors.password}</p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className='flex justify-end'>
                  <Link to='#' className='text-sm text-blue-600 hover:underline'>
                    Forgot Password?
                  </Link>
                </div>

                {error && (
                  <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm'>
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full bg-yellow-300 hover:bg-yellow-400 disabled:opacity-70 disabled:cursor-not-allowed text-gray-900 rounded-md py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2'
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>

                {/* Sign Up Link */}
                <p className='text-sm text-center text-gray-600 mt-6'>
                  Dont have an account?{' '}
                  <button
                    type='button'
                    className='text-blue-600 hover:underline font-medium'
                    onClick={() => (onNavigate ? onNavigate('signup') : navigate('/signup'))}
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login