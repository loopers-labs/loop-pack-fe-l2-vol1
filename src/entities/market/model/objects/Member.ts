import type { MemberDto, MemberGrade } from '../types'

export class Member {
  readonly name: string
  readonly grade: MemberGrade
  readonly point: number

  constructor(memberDto: MemberDto) {
    this.name = memberDto.name
    this.grade = memberDto.grade
    this.point = memberDto.point
  }
}
