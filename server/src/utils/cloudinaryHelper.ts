

export const extractPublicIdFromUrl =(url:string):string | null =>{
  try {
    const parts = url.split('/')
    const fileNameWithExtension = parts.pop()
    const folder = parts.pop()

    if(!fileNameWithExtension || !folder )
      return null

    const publicId = fileNameWithExtension.split('.')[0]
    return `${folder}/${publicId}`
  } catch (error) {
    return null
  }
}