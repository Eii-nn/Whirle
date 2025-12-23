import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CharacterModel from '../assets/Login/model.svg'
import CharacterModel1 from '../assets/Login/model1.svg'
import CharacterModel2 from '../assets/Login/model2.svg'
import Background from '../assets/Login/Background.svg'
import { registerUser } from '../Services/api'
import type { ApiError } from '../Services/api'
import { COUNTRIES } from '../constants/countries'
import { getFriends } from '../Services/friendshipApi'

interface SignupProps {
  onNavigate?: (view: 'landing' | 'login') => void
}

const Signup = ({ onNavigate }: SignupProps) => {
  const navigate = useNavigate()

  // Step management
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1 form fields
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2 & 3 form fields
  const [bio, setBio] = useState('')
  const [birthdate, setBirthdate] = useState('') // YYYY-MM-DD
  const [countryCode, setCountryCode] = useState('')

  // Error and loading states
  const [error, setError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const bioMaxLength = 100
  const remainingChars = bioMaxLength - bio.length

  // Check if user already has a valid token on mount
  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      const validateToken = async () => {
        try {
          await getFriends(1)
          // Token is valid, redirect to chat
          navigate('/chat')
        } catch (error) {
          // Token is invalid, stay on signup page
          // Clear invalid token
          localStorage.removeItem('jwt_token')
          localStorage.removeItem('user')
        }
      }
      validateToken()
    }
  }, [navigate])

  // Character model based on current step
  const getCharacterModel = () => {
    switch (currentStep) {
      case 1:
        return CharacterModel
      case 2:
        return CharacterModel1
      case 3:
        return CharacterModel2
      default:
        return CharacterModel
    }
  }

  // Progress indicator component
  const ProgressIndicator = () => {
    const getStepStyle = (step: number) => {
      if (step <= currentStep) {
        return 'bg-blue-600 text-white'
      }
      return 'border-2 border-blue-200 text-blue-200'
    }

    const getLineStyle = (step: number) => {
      if (step < currentStep) {
        return 'bg-blue-600'
      }
      return 'bg-blue-200'
    }

    return (
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepStyle(1)} text-sm font-semibold`}>
          1
        </div>
        <div className={`flex-1 h-0.5 ${getLineStyle(1)}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepStyle(2)} text-sm font-semibold`}>
          2
        </div>
        <div className={`flex-1 h-0.5 ${getLineStyle(2)}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepStyle(3)} text-sm font-semibold`}>
          3
        </div>
      </div>
    )
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep === 1) {
      onNavigate ? onNavigate('landing') : navigate('/')
    } else {
      setCurrentStep(currentStep - 1)
      setError('')
      setFieldErrors({})
    }
  }

  const birthdateDisplay = () => {
    return birthdate || '—'
  }

  const iso3ToFlag = (code: string) => {
    const iso2 = code.slice(0, 2).toUpperCase()
    if (iso2.length !== 2) return ''
    const codePoints = [...iso2].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65))
    return String.fromCodePoint(...codePoints)
  }

  const validateStep1 = () => {
    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()
    const stepErrors: Record<string, string> = {}

    if (!trimmedUsername || trimmedUsername.length < 3 || trimmedUsername.length > 32) {
      stepErrors.username = 'Username must be 3-32 characters long.'
    }
    if (!password || password.length < 8 || password.length > 128) {
      stepErrors.password = 'Password must be 8-128 characters long.'
    }
    if (!confirmPassword) {
      stepErrors['confirm-password'] = 'Please confirm your password.'
    } else if (password !== confirmPassword) {
      stepErrors['confirm-password'] = 'Passwords do not match.'
    }
    if (!trimmedEmail) {
      stepErrors.email = 'Email is required.'
    }

    if (Object.keys(stepErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...stepErrors }))
      setError('Please fix the highlighted fields and try again.')
      return false
    }

    return true
  }

  const validateStep2 = () => {
    const trimmedBio = bio.trim()
    const stepErrors: Record<string, string> = {}

    if (trimmedBio.length > 255) {
      stepErrors.bio = 'Bio must be at most 255 characters.'
    }
    if (!birthdate) {
      stepErrors.birthdate = 'Birthdate is required.'
    } else {
      const d = new Date(birthdate)
      if (Number.isNaN(d.getTime())) {
        stepErrors.birthdate = 'Invalid birthdate.'
      } else {
        const today = new Date()
        let age = today.getFullYear() - d.getFullYear()
        const m = today.getMonth() - d.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
          age--
        }
        if (age < 13) {
          stepErrors.birthdate = 'You must be at least 13 years old.'
        }
      }
    }
    if (!countryCode || countryCode.trim().length !== 3) {
      stepErrors['country-code'] = 'Country code must be a 3-letter ISO code (e.g., USA).'
    }

    if (Object.keys(stepErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...stepErrors }))
      setError('Please fix the highlighted fields and try again.')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    setError('')
    setFieldErrors({})
    setIsLoading(true)

    try {
      const trimmedUsername = username.trim()
      const trimmedEmail = email.trim()
      const trimmedBio = bio.trim()

      const isStep1Valid = validateStep1()
      const isStep2Valid = validateStep2()

      if (!isStep1Valid || !isStep2Valid) {
        return
      }

      const response = await registerUser({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        'confirm-password': confirmPassword,
        bio: trimmedBio,
        birthdate,
        'country-code': countryCode.toUpperCase(),
      })

      // Save JWT token to localStorage
      localStorage.setItem('jwt_token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))

      // Redirect to Chat page
      navigate('/chat')
    } catch (err) {
      const apiError = err as ApiError

      if (apiError.fields) {
        const mappedFields: Record<string, string> = {}
        Object.entries(apiError.fields).forEach(([key, value]) => {
          const normalized = key.toLowerCase()
          switch (normalized) {
            case 'username':
              mappedFields.username = value
              break
            case 'email':
              mappedFields.email = value
              break
            case 'password':
              mappedFields.password = value
              break
            case 'confirmpassword':
            case 'confirm-password':
              mappedFields['confirm-password'] = value
              break
            case 'bio':
              mappedFields.bio = value
              break
            case 'birthdate':
              mappedFields.birthdate = value
              break
            case 'countrycode':
            case 'country-code':
              mappedFields['country-code'] = value
              break
            default:
              mappedFields[key] = value
          }
        })
        setFieldErrors(mappedFields)
      }

      setError(apiError.error || 'Registration failed. Please check the highlighted fields and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderErrorBanner = () =>
    error ? (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
        {error}
      </div>
    ) : null

  // Render Step 1: Create Your Account
  const renderStep1 = () => (
    <>
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Create Your Account
      </h1>
      <ProgressIndicator />
      <p className="text-sm text-gray-500 mb-8">
        Let's get you ready to whirl!
      </p>
      <form className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setFieldErrors({ ...fieldErrors, username: '' })
            }}
            placeholder="Username"
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.username ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {fieldErrors.username && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.username}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setFieldErrors({ ...fieldErrors, email: '' })
            }}
            placeholder="Email"
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setFieldErrors({ ...fieldErrors, password: '' })
            }}
            placeholder="Password"
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.password ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
          )}
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setFieldErrors({ ...fieldErrors, 'confirm-password': '' })
            }}
            placeholder="Password"
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors['confirm-password'] ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {fieldErrors['confirm-password'] && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors['confirm-password']}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setError('')
            const ok = validateStep1()
            if (ok) handleNext()
          }}
          className="w-full bg-yellow-300 hover:bg-yellow-400 text-white rounded-md py-2.5 text-sm font-medium transition-colors"
        >
          Next
        </button>
        {renderErrorBanner()}
      </form>
    </>
  )

  // Render Step 2: Tell Us a Bit About You
  const renderStep2 = () => (
    <>
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Tell Us a Bit About You
      </h1>
      <ProgressIndicator />
      <p className="text-sm text-gray-500 mb-8">
        Who's behind the chat?
      </p>
      <form className="space-y-6">
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1.5">
            Bio
          </label>
          <div className="relative">
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= bioMaxLength) {
                  setBio(e.target.value)
                  setFieldErrors({ ...fieldErrors, bio: '' })
                }
              }}
              placeholder="Bio."
              rows={4}
              className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                fieldErrors.bio ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {remainingChars}/100 characters remaining
            </div>
          </div>
          {fieldErrors.bio && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.bio}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Birthdate
          </label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => {
              setBirthdate(e.target.value)
              setFieldErrors({ ...fieldErrors, birthdate: '' })
            }}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 13))
              .toISOString()
              .slice(0, 10)}
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.birthdate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {fieldErrors.birthdate && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.birthdate}</p>
          )}
        </div>
        <div>
          <label htmlFor="country-code-step2" className="block text-sm font-medium text-gray-700 mb-1.5">
            Country (ISO 3166-1 alpha-3)
          </label>
          <select
            id="country-code-step2"
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value)
              setFieldErrors({ ...fieldErrors, 'country-code': '' })
            }}
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors['country-code'] ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">E.g., USA, PHL, GBR</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {iso3ToFlag(country.code)} {country.name} ({country.code})
              </option>
            ))}
          </select>
          {fieldErrors['country-code'] && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors['country-code']}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setError('')
            const ok = validateStep2()
            if (ok) handleNext()
          }}
          className="w-full bg-yellow-300 hover:bg-yellow-400 text-white rounded-md py-2.5 text-sm font-medium transition-colors"
        >
          Next
        </button>
        {renderErrorBanner()}
      </form>
    </>
  )

  // Render Step 3: Final Touch
  const renderStep3 = () => (
    <>
      <h1 className="text-4xl font-bold text-blue-600 mb-3">
        Final Touch
      </h1>
      <div className="mb-4">
        <ProgressIndicator />
        <p className="text-sm text-gray-600 mt-2">
          Almost done!
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-blue-100">
                <img
                  src={CharacterModel2}
                  alt="Preview Avatar"
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-blue-600 font-semibold">Username</p>
                  <p className="font-semibold text-gray-900">{username || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-blue-600 font-semibold">Email</p>
                  <p className="text-gray-800 break-all">{email || '—'}</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-blue-600 font-semibold">Birthdate</p>
                <p className="text-gray-800">{birthdateDisplay()}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-blue-600 font-semibold">Country</p>
                <p className="text-gray-800">{countryCode || '—'}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-wide text-blue-600 font-semibold mb-1">Bio</p>
            <div className="bg-white border border-blue-100 rounded-lg p-3 text-sm text-gray-800 min-h-[64px]">
              {bio || 'No bio added.'}
            </div>
          </div>
        </div>

        {renderErrorBanner()}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-[#F2E74E] hover:bg-[#e3d841] disabled:bg-gray-300 disabled:cursor-not-allowed text-[#5f4e00] rounded-md py-3 text-sm font-semibold transition-colors border border-[#e3d841]"
        >
          {isLoading ? 'Registering...' : 'Done'}
        </button>
      </div>
    </>
  )

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      default:
        return renderStep1()
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Section */}
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
              src={getCharacterModel()}
              alt="3D Character"
              className="h-[85%] max-h-[700px] w-auto object-contain"
            />
          </div>
        </section>

        {/* Right Section */}
        <section className="relative flex flex-col bg-white">
          <div className="flex-1 flex items-center justify-center px-8 py-12">
            <div className="w-full max-w-md">
              {renderStepContent()}
            </div>
          </div>
          <div className="p-6 pt-0 mt-auto flex justify-end">
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={handleBack}
            >
              Back
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Signup