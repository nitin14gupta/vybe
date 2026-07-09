import ApiService from './apiService'
export type { UserResponse, PhotoResponse, CityResponse, ProfileResponse, InterestResponse } from './apiService'

export const createProfile = (data: { name: string; dob: string; gender: string; bio?: string }) =>
  ApiService.createProfile(data)

export const updateProfile = (data: { name?: string; username?: string; dob?: string; gender?: string; bio?: string; badges?: string[] }) =>
  ApiService.updateProfile(data)

export const setInterests = (interests: string[]) =>
  ApiService.setInterests(interests)

export const setLocation = (city: string, lat: number, lng: number) =>
  ApiService.setLocation(city, lat, lng)

export const getMe = () => ApiService.getMe()

export const uploadPhoto = (uri: string, position: number) =>
  ApiService.uploadPhoto(uri, position)

export const deletePhoto = (id: string) => ApiService.deletePhoto(id)

export const swapPhotos = (positionA: number, positionB: number) =>
  ApiService.swapPhotos(positionA, positionB)

export const reorderPhotos = (updates: { id: string; position: number }[]) =>
  ApiService.reorderPhotos(updates)

export const uploadVoice = (uri: string) => ApiService.uploadVoice(uri)

export const getCities = () => ApiService.getCities()
export const getInterests = () => ApiService.getInterests()
export const getBadges = () => ApiService.getBadges()

export const getProfile = (userId: string) => ApiService.getProfile(userId)
export const followUser = (userId: string) => ApiService.followUser(userId)
export const unfollowUser = (userId: string) => ApiService.unfollowUser(userId)
