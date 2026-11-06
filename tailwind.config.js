/** @type {import('tailwindcss').Config} */
export default { darkMode:'class', content:['./index.html','./src/**/*.{ts,tsx}'], theme:{extend:{colors:{ink:'#172033',brand:{50:'#eef8ff',100:'#d9eeff',500:'#1685d1',600:'#0870b7',700:'#075a92'},success:'#16a070',warning:'#f4a227',danger:'#dc4f62'},boxShadow:{panel:'0 12px 35px rgba(23,32,51,.08)'}}},plugins:[require('@tailwindcss/forms')]};
