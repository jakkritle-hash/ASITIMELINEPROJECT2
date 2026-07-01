import { describe, it, expect } from 'vitest'
import { isAllowedEmail, initialRoleFor } from './policy'

describe('isAllowedEmail', () => {
  it('อนุญาตเฉพาะโดเมนที่กำหนด', () => {
    expect(isAllowedEmail('a@planbmedia.co.th', 'planbmedia.co.th')).toBe(true)
    expect(isAllowedEmail('a@gmail.com', 'planbmedia.co.th')).toBe(false)
    expect(isAllowedEmail('', 'planbmedia.co.th')).toBe(false)
  })
})

describe('initialRoleFor', () => {
  it('อีเมลใน bootstrap list = Admin', () => {
    expect(initialRoleFor('boss@planbmedia.co.th', ['boss@planbmedia.co.th'])).toBe('Admin')
  })
  it('อีเมลอื่น = Member', () => {
    expect(initialRoleFor('x@planbmedia.co.th', ['boss@planbmedia.co.th'])).toBe('Member')
  })
})
