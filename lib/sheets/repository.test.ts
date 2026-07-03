import { describe, it, expect } from 'vitest'
import { rowsToObjects, objectToRow, migrateUsersPageAccessValues } from './repository'

describe('rowsToObjects', () => {
  it('แปลง 2D array (แถวแรก=header) เป็น array ของ object', () => {
    const values = [
      ['id', 'name', 'active'],
      ['1', 'A', 'true'],
      ['2', 'B', 'false'],
    ]
    expect(rowsToObjects(values)).toEqual([
      { id: '1', name: 'A', active: 'true' },
      { id: '2', name: 'B', active: 'false' },
    ])
  })
  it('คืน [] เมื่อไม่มีข้อมูล (มีแต่ header หรือว่าง)', () => {
    expect(rowsToObjects([['id', 'name']])).toEqual([])
    expect(rowsToObjects([])).toEqual([])
  })
})

describe('objectToRow', () => {
  it('เรียงค่าตามลำดับ header ที่กำหนด', () => {
    const obj = { id: '1', name: 'A', active: 'true' }
    expect(objectToRow(obj, ['id', 'name', 'active'])).toEqual(['1', 'A', 'true'])
  })
  it('ช่องที่ไม่มีค่า = string ว่าง', () => {
    expect(objectToRow({ id: '1' }, ['id', 'name'])).toEqual(['1', ''])
  })
})

describe('migrateUsersPageAccessValues', () => {
  it('แปลง Users header เก่า pageDenied เป็น pageAccess พร้อมกลับค่า deny-list เป็น allow-list', () => {
    const values = [
      ['id', 'email', 'pageDenied'],
      ['u1', 'a@x.co', ''],
      ['u2', 'b@x.co', 'performance'],
      ['u3', 'c@x.co', 'dashboard,performance'],
    ]

    expect(migrateUsersPageAccessValues(values)).toEqual({
      migrated: true,
      values: [
        ['id', 'email', 'pageAccess'],
        ['u1', 'a@x.co', ''],
        ['u2', 'b@x.co', 'dashboard'],
        ['u3', 'c@x.co', '__none__'],
      ],
    })
  })

  it('ไม่แตะ Users header ที่เป็น pageAccess อยู่แล้ว', () => {
    const values = [
      ['id', 'email', 'pageAccess'],
      ['u1', 'a@x.co', 'dashboard'],
    ]

    expect(migrateUsersPageAccessValues(values)).toEqual({ values, migrated: false })
  })
})
