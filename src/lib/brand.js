const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Put the file in public/brand/ (see public/brand/README.txt).
export const APP_LOGO_URL = "/brand/sci-files-logo.png";

export const APP_NAME = "Sci-Files";