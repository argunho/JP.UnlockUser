export default function SessionWork() {
  const session = sessionStorage.getItem("sessionWork");
  console.log(session)
  return session !== null ? JSON.parse(session) : [];
}