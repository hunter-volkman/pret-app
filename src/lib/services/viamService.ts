import * as VIAM from '@viamrobotics/sdk'
import Cookies from 'js-cookie'
import type { ViamCredentials, StoreLocation } from '../types'

class ViamService {
  private clients = new Map<string, VIAM.RobotClient>()
  private cameras = new Map<string, VIAM.CameraClient>()

  getCredentials(machineId: string): ViamCredentials | null {
    try {
      // First try cookies (for Viam Apps)
      const cookieData = Cookies.get(machineId)
      if (cookieData) {
        return JSON.parse(cookieData)
      }
      
      // Fallback to localStorage (for development)
      const stored = localStorage.getItem('viam-credentials')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to get Viam credentials:', error)
    }
    return null
  }

  async connectToStore(store: StoreLocation): Promise<boolean> {
    try {
      const credentials = this.getCredentials(store.machineId)
      if (!credentials) {
        console.warn(`No credentials found for ${store.name}`)
        return false
      }

      const client = await VIAM.createRobotClient({
        host: credentials.hostname,
        credentials: {
          type: 'api-key',
          authEntity: credentials.id,
          payload: credentials.key,
        },
        signalingAddress: 'https://app.viam.com:443',
      })

      this.clients.set(store.id, client)
      
      // Try to get camera component
      try {
        const camera = new VIAM.CameraClient(client, 'ffmpeg')
        this.cameras.set(store.id, camera)
      } catch (error) {
        console.warn(`No camera found for ${store.name}`)
      }

      return true
    } catch (error) {
      console.error(`Failed to connect to ${store.name}:`, error)
      return false
    }
  }

  getClient(storeId: string): VIAM.RobotClient | null {
    return this.clients.get(storeId) || null
  }

  getCamera(storeId: string): VIAM.CameraClient | null {
    return this.cameras.get(storeId) || null
  }

  async getCameraImage(storeId: string): Promise<string | null> {
    try {
      const camera = this.getCamera(storeId)
      if (!camera) return null

      const image = await camera.getImage()
      const blob = new Blob([image], { type: 'image/jpeg' })
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Failed to get camera image:', error)
      return null
    }
  }

  disconnect(storeId: string): void {
    const client = this.clients.get(storeId)
    if (client) {
      try {
        client.disconnect()
      } catch (error) {
        console.warn('Error disconnecting client:', error)
      }
      this.clients.delete(storeId)
      this.cameras.delete(storeId)
    }
  }

  disconnectAll(): void {
    for (const storeId of this.clients.keys()) {
      this.disconnect(storeId)
    }
  }
}

export const viamService = new ViamService()
