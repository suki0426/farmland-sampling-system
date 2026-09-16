package com.jeeplus.commons.verify.sm3;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

/**
 * @auther 高靖奇
 * @date 2025/7/15
 */
@WebFilter(urlPatterns = "/*")
public class CachingRequestBodyFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        CachedBodyHttpServletRequest wrappedRequest = new CachedBodyHttpServletRequest(httpRequest);
        chain.doFilter(wrappedRequest, response); // 传递缓存后的请求
    }
}
