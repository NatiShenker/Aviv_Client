// ייבוא קובץ תמונה מחזיר את הכתובת שלו אחרי הבנייה (כלל asset/resource ב-webpack.config.js)
declare module "*.png" {
  const url: string;
  export default url;
}
