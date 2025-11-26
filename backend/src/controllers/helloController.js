export const getHello = (req, res) => {
  res.json({
    message: 'Hello from Backend!',
    timestamp: new Date().toISOString()
  });
};
