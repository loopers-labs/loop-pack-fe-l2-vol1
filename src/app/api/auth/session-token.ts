// mock 백엔드가 밖으로 공개하는 세션 토큰 계약(발급·검증). node:crypto 를 쓰므로 Node 런타임에서만 import 한다
export { createSessionToken, readSessionToken } from "@/app/api/_data/auth";
