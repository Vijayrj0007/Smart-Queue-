const fetch = global.fetch;

(async () => {
  const now = Date.now();

  // ---------- Organization flow ----------
  const orgEmail = `org_${now}@example.com`;
  const orgPayload = { name: 'Org Test', email: orgEmail, password: 'password123', type: 'hospital' };

  const regRes = await fetch('http://localhost:5000/api/org/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orgPayload),
  });
  const regJson = await regRes.json();
  console.log('direct org register', regRes.status, regJson?.message);

  const loginRes = await fetch('http://localhost:5000/api/org/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: orgEmail, password: 'password123' }),
  });
  const loginJson = await loginRes.json();
  const orgToken = loginJson?.data?.accessToken;
  console.log('direct org login', loginRes.status, loginJson?.message, 'token?', !!orgToken);

  const queuesRes = await fetch('http://localhost:5000/api/org/queues', {
    method: 'GET',
    headers: { Authorization: `Bearer ${orgToken}` },
  });
  const queuesJson = await queuesRes.json();
  console.log('direct org queues', queuesRes.status, queuesJson?.success, 'count=', queuesJson?.data?.length);

  // ---------- Proxy org flow via Next ----------
  const org2Email = `org2_${now}@example.com`;
  const regRes2 = await fetch('http://localhost:3000/backend/org/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...orgPayload, email: org2Email }),
  });
  const regJson2 = await regRes2.json();
  console.log('proxy org register', regRes2.status, regJson2?.message);

  const loginRes2 = await fetch('http://localhost:3000/backend/org/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: org2Email, password: 'password123' }),
  });
  const loginJson2 = await loginRes2.json();
  const orgToken2 = loginJson2?.data?.accessToken;
  console.log('proxy org login', loginRes2.status, loginJson2?.message, 'token?', !!orgToken2);

  const queuesRes2 = await fetch('http://localhost:3000/backend/org/queues', {
    method: 'GET',
    headers: { Authorization: `Bearer ${orgToken2}` },
  });
  const queuesJson2 = await queuesRes2.json();
  console.log('proxy org queues', queuesRes2.status, queuesJson2?.success, 'count=', queuesJson2?.data?.length);

  // ---------- User flow via proxy ----------
  const userEmail = `user_${now}@example.com`;
  const userReg = await fetch('http://localhost:3000/backend/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User Test', email: userEmail, password: 'password123', phone: '' }),
  });
  const userRegJson = await userReg.json();
  console.log('proxy user register', userReg.status, userRegJson?.message);

  const userLogin = await fetch('http://localhost:3000/backend/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: 'password123' }),
  });
  const userLoginJson = await userLogin.json();
  const userToken = userLoginJson?.data?.accessToken;
  console.log('proxy user login', userLogin.status, userLoginJson?.message, 'token?', !!userToken);

  const myTokens = await fetch('http://localhost:3000/backend/tokens/my', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const myTokensJson = await myTokens.json();
  console.log('proxy user my tokens', myTokens.status, myTokensJson?.success, 'len=', myTokensJson?.data?.length);
})();

