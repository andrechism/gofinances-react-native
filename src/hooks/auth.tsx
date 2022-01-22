import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";

import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';

import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthProviderProps {
  children: ReactNode
}

interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface AuthContextData {
  user: User;
  userStorageLoading: boolean;
  signInWithGoogle(): Promise<void>;
  signInWithApple(): Promise<void>;
  signOut(): Promise<void>
}

interface AuthorizationResponse {
  params: {
    access_token: string;
  },
  type: string;
}

const AuthContext = createContext({} as AuthContextData);

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>({} as User)
  const [userStorageLoading, setUserStorageLoading] = useState(true)

  const userStorageKey = process.env.USER_STORAGE_KEY || '@gofinances:user'
  
  async function signInWithGoogle() {
    try {
      const CLIENT_ID = process.env.CLIENT_ID
      const REDIRECT_URI = process.env.REDIRECT_URI
      const RESPONSE_TYPE = 'token'
      const SCOPE = encodeURI('profile email')
      const PROMPT = 'select_account'

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}&prompt=${PROMPT}`

      const { params, type } = await AuthSession.startAsync({ authUrl }) as AuthorizationResponse

      console.log('params', params)

      if(type === 'success') {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${params.access_token}`)
        const userInfo = await response.json()

        const userData = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.given_name,
          photo: userInfo.picture
        }

        setUser(userData)
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(userData))
      }
      
    } catch (error: any) {
      throw new Error(error)
    }
  }

  async function signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      })

      if(credential) {
        const name = credential.fullName!.givenName!
        const photo = `https://ui-avatars.com/api/?name=${name}&length=1`
        const userData = {
          id: credential.user,
          email: credential.email!,
          name,
          photo 
        }

        setUser(userData)
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(userData))
      }
    } catch (error: any) {
      throw new Error(error)
    }
  }

  async function signOut() {
    setUser({} as User)
    await AsyncStorage.removeItem(userStorageKey)
  }

  useEffect(() => {
    async function loadUserStorageData() {
      const userData = await AsyncStorage.getItem(userStorageKey)

      if (userData) {
        const user = JSON.parse(userData) as User
        setUser(user)
      }

      setUserStorageLoading(false)
    }

    loadUserStorageData()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      userStorageLoading,
      signInWithGoogle,
      signInWithApple,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const context = useContext(AuthContext);

  return context;
}


export { AuthProvider, useAuth }