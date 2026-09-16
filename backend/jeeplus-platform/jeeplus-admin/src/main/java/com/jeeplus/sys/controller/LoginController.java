/**
 * Copyright &copy; 2021-2026 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.sys.controller;

import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.LineCaptcha;
import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.servlet.ServletUtil;
import com.jeeplus.aop.logging.annotation.ApiLog;
import com.jeeplus.common.redis.RedisUtils;
import com.jeeplus.common.utils.RequestUtils;
import com.jeeplus.common.utils.ResponseUtil;
import com.jeeplus.config.properties.JeePlusProperties;
import com.jeeplus.core.errors.ErrorConstants;
import com.jeeplus.security.jwt.TokenProvider;
import com.jeeplus.security.util.SecurityUtils;
import com.jeeplus.sys.constant.CacheNames;
import com.jeeplus.sys.constant.CommonConstants;
import com.jeeplus.sys.constant.enums.LogTypeEnum;
import com.jeeplus.sys.model.LoginForm;
import com.jeeplus.sys.service.UserService;
import com.jeeplus.sys.service.dto.UserDTO;
import com.jeeplus.sys.utils.UserUtils;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jasig.cas.client.authentication.AttributePrincipal;
import org.jasig.cas.client.validation.Assertion;
import org.jasig.cas.client.validation.Cas20ServiceTicketValidator;
import org.jasig.cas.client.validation.TicketValidationException;
import org.jasig.cas.client.validation.TicketValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.security.Security;
import java.util.*;

/**
 * 登录Controller
 *
 * @author jeeplus
 * @version 2021-5-31
 */
@Slf4j
@RestController
@Api(tags = "登录管理")
public class LoginController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private RedisUtils redisUtils;

    /**
     * 用户登录
     *
     * @param loginForm
     * @return
     */
    @PostMapping("/sys/login")
    @ApiLog(value = "用户登录", type = LogTypeEnum.LOGIN)
    @ApiOperation("登录接口")
    public ResponseEntity login(@RequestBody @Validated LoginForm loginForm) throws Exception {


        ResponseUtil responseUtil = new ResponseUtil();
        String username = loginForm.getUsername();
        //  解密
        String key = "quanquankejigong"; // 替换为你自己的密钥
        String password = decrypt(loginForm.getPassword(), key);
//        System.out.println("密码是:"+ password +"----------------------------------------------");
        // 验证验证码是否正确
        String code = loginForm.getCode();
        if (!code.equals(RedisUtils.getInstance().get(CacheNames.SYS_CACHE_CODE, loginForm.getUuid()))) {
            throw new AccountExpiredException(ErrorConstants.LOGIN_ERROR_ERROR_VALIDATE_CODE);
        }
        // 只要验证码使用过 验证为正确 那就重新生成验证码
//        LineCaptcha lineCaptcha = CaptchaUtil.createLineCaptcha(116, 36, 4, 50);
//        String uuid = UUID.randomUUID().toString();
//        //将验证码放入session
//        RedisUtils.getInstance().set(CacheNames.SYS_CACHE_CODE, uuid, lineCaptcha.getCode());
//        RedisUtils.getInstance().expire(CacheNames.SYS_CACHE_CODE, uuid, 60 * 5);
        // 验证码不能设置 需要删除对应的验证码
        RedisUtils.getInstance().delete(CacheNames.SYS_CACHE_CODE, loginForm.getUuid());

        SecurityUtils.login(username, password, authenticationManager); //登录操作spring security

        /**
         * 单一登录判断
         */
        if (!userService.isEnableLogin(username)) {
            throw new DisabledException(ErrorConstants.LOGIN_ERROR_FORBID_LOGGED_IN_ELSEWHERE);
        }

        //登录成功，生成token
        UserDTO userDTO = UserUtils.getByLoginName(username);
        String token = TokenProvider.createAccessToken(username, userDTO.getPassword());
        responseUtil.add(TokenProvider.TOKEN, token);
        //更新登录信息
        updateUserLoginInfo(responseUtil, userDTO, token);

        return responseUtil.ok();
    }


    /**
     * cas登录
     * vue 传递ticket参数验证，并返回token
     */
    @ApiLog(value = "单点登录", type = LogTypeEnum.ACCESS)
    @RequestMapping("/sys/casLogin")
    public ResponseEntity casLogin(@RequestParam(name = "ticket") String ticket,
                                   @RequestParam(name = "service") String service, @Value("${cas.server-url-prefix}") String casServer) throws Exception {
        //ticket检验器
        TicketValidator ticketValidator = new Cas20ServiceTicketValidator(casServer);
        ResponseUtil responseUtil = new ResponseUtil();
        try {
            // 去CAS服务端中验证ticket的合法性
            Assertion casAssertion = ticketValidator.validate(ticket, service);
            // 从CAS服务端中获取相关属性,包括用户名、是否设置RememberMe等
            AttributePrincipal casPrincipal = casAssertion.getPrincipal();
            String loginName = casPrincipal.getName();
            // 校验用户名密码
            UserDTO userDTO = UserUtils.getByLoginName(loginName);
            if (userDTO != null) {
                if (CommonConstants.NO.equals(userDTO.getLoginFlag())) {
                    throw new LockedException(ErrorConstants.LOGIN_ERROR_FORBIDDEN);
                }
                // 单点登录实现不需要校验用户名密码
//                SecurityUtils.login (userDTO.getLoginName (), userDTO.getPassword (), authenticationManager  );
                String token = TokenProvider.createAccessToken(userDTO.getLoginName(), userDTO.getPassword());
                Authentication authentication = TokenProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                responseUtil.add(TokenProvider.TOKEN, token);
                // 更新登录信息
                updateUserLoginInfo(responseUtil, userDTO, token);

                return responseUtil.ok();
            } else {
                AuthenticationException e = new UsernameNotFoundException(ErrorConstants.LOGIN_ERROR_NOTFOUND);
                log.error("用户【loginName:" + loginName + "】不存在!", e);
                throw e;
            }
        } catch (TicketValidationException e) {
            log.error("Unable to validate ticket [" + ticket + "]", e);
            throw new CredentialsExpiredException("未通过验证的ticket [" + ticket + "]", e);
        }

    }

    @ApiLog(value = "hs单点登录", type = LogTypeEnum.ACCESS)
    @RequestMapping("/sys/hbCasLogin")
    public ResponseEntity hbCasLogin(@RequestParam(name = "ticket") String ticket,
                                   @RequestParam(name = "service") String service, @Value("${cas.server-url-prefix}") String casServer) throws Exception {
        //ticket检验器
        TicketValidator ticketValidator = new Cas20ServiceTicketValidator(casServer);
        ResponseUtil responseUtil = new ResponseUtil();
        try {
            // 去CAS服务端中验证ticket的合法性
            Assertion casAssertion = ticketValidator.validate(ticket, service);
            // 从CAS服务端中获取相关属性,包括用户名、是否设置RememberMe等
            AttributePrincipal casPrincipal = casAssertion.getPrincipal();
            String loginName = casPrincipal.getName();
            // 校验用户名密码
            UserDTO userDTO = UserUtils.getByLoginName(loginName);
            if (userDTO != null) {
                if (CommonConstants.NO.equals(userDTO.getLoginFlag())) {
                    throw new LockedException(ErrorConstants.LOGIN_ERROR_FORBIDDEN);
                }
                // 单点登录实现不需要校验用户名密码
//                SecurityUtils.login (userDTO.getLoginName (), userDTO.getPassword (), authenticationManager  );
                String token = TokenProvider.createAccessToken(userDTO.getLoginName(), userDTO.getPassword());
                Authentication authentication = TokenProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                responseUtil.add(TokenProvider.TOKEN, token);
                // 更新登录信息
                updateUserLoginInfo(responseUtil, userDTO, token);

                return responseUtil.ok();
            } else {
                AuthenticationException e = new UsernameNotFoundException(ErrorConstants.LOGIN_ERROR_NOTFOUND);
                log.error("用户【loginName:" + loginName + "】不存在!", e);
                throw e;
            }
        } catch (TicketValidationException e) {
            log.error("Unable to validate ticket [" + ticket + "]", e);
            throw new CredentialsExpiredException("未通过验证的ticket [" + ticket + "]", e);
        }

    }


    static {
        Security.addProvider(new BouncyCastleProvider());  // 将Bouncy Castle添加为提供者
    }

    public static String decrypt(String encryptedText, String secretKey) {
        try {
            // 从提供的secretKey字符串创建SecretKey
            SecretKey key = new SecretKeySpec(secretKey.getBytes(), "AES");

            // 使用提供的key、模式和填充，初始化Cipher，指定提供者为Bouncy Castle
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS7Padding", "BC");
            cipher.init(Cipher.DECRYPT_MODE, key);

            // 将Base64编码的字符串转换为字节数组
            byte[] decodedBytes = Base64.getDecoder().decode(encryptedText);

            // 执行解密
            byte[] decryptedBytes = cipher.doFinal(decodedBytes);

            // 将解密后的字节数组转换为字符串
            return new String(decryptedBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }


    private void updateUserLoginInfo(ResponseUtil responseUtil, UserDTO userDTO, String token) {

        String username = userDTO.getLoginName();
        redisUtils.set(CacheNames.USER_CACHE_TOKEN + username + ":" + token, token);
        redisUtils.expire(CacheNames.USER_CACHE_TOKEN + username + ":" + token, JeePlusProperties.newInstance().getEXPIRE_TIME());
        responseUtil.add("oldLoginDate", userDTO.getLoginDate());
        responseUtil.add("oldLoginIp", userDTO.getLoginIp());
        //更新登录日期
        userDTO.setLoginDate(new Date());
        userDTO.setLoginIp(ServletUtil.getClientIP(RequestUtils.getRequest()));
        userService.updateUserLoginInfo(userDTO);

    }


    /**
     * 退出登录
     *
     * @param request
     * @param response
     * @return
     */
    @ApiOperation("退出登录")
    @ApiLog(value = "退出登录", type = LogTypeEnum.LOGIN)
    @GetMapping("/sys/logout")
    public ResponseEntity logout(HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = SecurityUtils.getAuthentication();
        if (auth != null) {
            UserUtils.deleteCache(UserUtils.getCurrentUserDTO());
            String token = TokenProvider.resolveToken(request);
            redisUtils.delete(CacheNames.USER_CACHE_TOKEN + TokenProvider.getLoginName(token) + ":" + token);
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }
        return ResponseEntity.ok("退出成功");
    }


    /**
     * 获取登陆验证码
     *
     * @throws
     */
    @ApiOperation("获取验证码")
    @ApiLog("获取验证码")
    @GetMapping("/sys/getCode")
    public ResponseEntity getCode() {
        //HuTool定义图形验证码的长和宽,验证码的位数，干扰线的条数
        LineCaptcha lineCaptcha = CaptchaUtil.createLineCaptcha(116, 36, 4, 50);
        String uuid = UUID.randomUUID().toString();
        //将验证码放入session
        RedisUtils.getInstance().set(CacheNames.SYS_CACHE_CODE, uuid, lineCaptcha.getCode());
        RedisUtils.getInstance().expire(CacheNames.SYS_CACHE_CODE, uuid, 60 * 5);
        return ResponseUtil.newInstance().add("codeImg", lineCaptcha.getImageBase64()).add("uuid", uuid).ok();
    }

    /**
     * 根据token查询用户信息
     * @param token
     * @return
     */
    public boolean validateToken ( String token ) {
        // 使用token 查询用户信息
        String accessToken= null;
        if(StrUtil.isNotEmpty ( token ) ){
            String loginName = TokenProvider.getLoginName ( token );
            if(StrUtil.isNotEmpty ( loginName )) {
                Object accessTokenObj = RedisUtils.getInstance ( ).get ( CacheNames.USER_CACHE_TOKEN + loginName + ":" + token );
                if ( accessTokenObj != null ) {
                    accessToken = accessTokenObj.toString ( );
                }
            }
        }
        if (StrUtil.isNotBlank ( accessToken ) && !accessToken.equals ( "kickOut" )) {
            if (TokenProvider.validateToken(token, accessToken)) { // 验证token是合法token
                if ( SecurityContextHolder.getContext().getAuthentication() != null) {
                    Authentication authentication = TokenProvider.getAuthentication ( accessToken );
                    SecurityContextHolder.getContext ( ).setAuthentication ( authentication );
                    return true;
                }
            }
        }
        return false;
    }
}
