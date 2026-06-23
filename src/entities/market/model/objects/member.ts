import type { MemberData, MemberGrade } from '../types'

export class Member {
  readonly name: string
  readonly grade: MemberGrade
  readonly point: number

  constructor(data: MemberData) {
    this.name = data.name
    this.grade = data.grade
    this.point = data.point
  }
}
