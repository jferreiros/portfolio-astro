export async function post({ request }) {
    const data = await request.json();
    const { name, email } = data;
  
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer YOUR_RESEND_API_KEY`
      },
      body: JSON.stringify({
        from: 'your-email@example.com',
        to: 'your-email@example.com',
        subject: 'New Contact Form Submission',
        html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p>`
      })
    });
  
    if (response.ok) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false }), { status: 500 });
    }
  }