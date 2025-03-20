export default function SessionData(item) {
  const session = sessionStorage.getItem(item);
  
  return !!session ? JSON.parse(session) : [];
}