import smtplib

smtp_server = 'smtp.office365.com'
port = 587
sender_email = 'medicotest@outlook.fr'
password = 'Mediconidhaldalhoumi1'

try:
    server = smtplib.SMTP(smtp_server, port)
    server.starttls()
    server.login(sender_email, password)
    print("Login successful")
    server.quit()
except Exception as e:
    print("Login failed:", e)
