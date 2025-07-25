from ftplib import FTP

ftp_host = '127.0.0.1'  # or your server IP
ftp_user = 'test'    # your FTP username
ftp_pass = '1234'   # your FTP password

ftp = FTP(ftp_host)
ftp.login(user=ftp_user, passwd=ftp_pass)

print("Connected. Files in directory:")
files = ftp.nlst()
for f in files:
    print(f)

ftp.quit()