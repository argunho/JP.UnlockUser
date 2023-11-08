export default function SessionPasswordsList() {
  const session = sessionStorage.getItem("sessionWork");

  return session !== null ? JSON.parse(session) : [];
}