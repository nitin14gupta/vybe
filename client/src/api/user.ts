import ApiService from './apiService'
export type { UserResponse, PhotoResponse } from './apiService'

export const createProfile = (data: { name: string; dob: string; gender: string }) =>
  ApiService.createProfile(data)

export const updateProfile = (data: { name?: string; dob?: string; gender?: string }) =>
  ApiService.updateProfile(data)

export const setInterests = (interests: string[]) =>
  ApiService.setInterests(interests)

export const setLocation = (city: string, lat: number, lng: number) =>
  ApiService.setLocation(city, lat, lng)

export const getMe = () => ApiService.getMe()

export const uploadPhoto = (uri: string, position: number) =>
  ApiService.uploadPhoto(uri, position)

export const deletePhoto = (id: string) => ApiService.deletePhoto(id)

export const uploadVoice = (uri: string) => ApiService.uploadVoice(uri)
