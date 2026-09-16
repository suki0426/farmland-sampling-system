package com.jeeplus.commons.verify.sm3;

import javax.servlet.ReadListener;
import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import java.io.*;

public class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {
    private final byte[] cachedBody;

    public CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
        super(request);
        // ✅ 兼容 JDK 1.8 的字节流读取方式
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[1024];
        int bytesRead;
        try (InputStream is = request.getInputStream()) {
            while ((bytesRead = is.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, bytesRead);
            }
        }
        this.cachedBody = buffer.toByteArray();
    }

    @Override
    public BufferedReader getReader() {
        return new BufferedReader(new InputStreamReader(getInputStream()));
    }

    @Override
    public ServletInputStream getInputStream() {
        return new ServletInputStream() {
            private final ByteArrayInputStream inputStream = new ByteArrayInputStream(cachedBody);

            @Override
            public boolean isFinished() {
                return inputStream.available() == 0;
            }

            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setReadListener(ReadListener readListener) {
                throw new UnsupportedOperationException("Not supported");
            }

            @Override
            public int read() throws IOException {
                return inputStream.read();
            }
        };
    }
}
