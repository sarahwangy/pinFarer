import { detectPlaceType } from './place-type'

describe('detectPlaceType', () => {
  it('detects property from street number', () => {
    expect(detectPlaceType('12 Chapel Street')).toBe('property')
  })

  it('detects property from Street keyword', () => {
    expect(detectPlaceType('Chapel Street')).toBe('property')
  })

  it('detects property from Ave', () => {
    expect(detectPlaceType('Collins Ave')).toBe('property')
  })

  it('detects property from Road', () => {
    expect(detectPlaceType('Brighton Road')).toBe('property')
  })

  it('detects property from Chinese number indicator', () => {
    expect(detectPlaceType('上海市浦东新区张江高科技园区碧波路690号')).toBe('property')
  })

  it('detects property from 室', () => {
    expect(detectPlaceType('3室2厅')).toBe('property')
  })

  it('defaults to city for place names', () => {
    expect(detectPlaceType('Melbourne')).toBe('city')
  })

  it('defaults to city for landmarks', () => {
    expect(detectPlaceType('Caulfield Library')).toBe('city')
  })

  it('defaults to city for countries', () => {
    expect(detectPlaceType('Japan')).toBe('city')
  })
})
