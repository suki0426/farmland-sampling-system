package com.jeeplus.config;

import cn.hutool.core.util.ReUtil;
import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.pagination.dialects.IDialect;
import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.schema.Column;
import net.sf.jsqlparser.statement.select.*;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class CustomPaginationInnerInterceptor extends PaginationInnerInterceptor {

    /**
     * 特殊字符正则匹配.
     */
    String regEx = ".*[\\s`~!@#$%^&*()+=|{}':;',\\[\\]<>/?~！@#￥%……&*（）——+|{}【】‘；：”“’。，、？\\\\]+.*";
    /**
     * 关键字集合.
     */
    Set<String> keySet = new HashSet<>(Arrays.asList("select ", " and ", " or ", " xor ", " where "));

    /**
     * Instantiates a new Custom pagination inner interceptor.
     *
     * @param dbType the db type
     */
    public CustomPaginationInnerInterceptor(DbType dbType) {
        super(dbType);
    }

    /**
     * Instantiates a new Custom pagination inner interceptor.
     *
     * @param dialect the dialect
     */
    public CustomPaginationInnerInterceptor(IDialect dialect) {
        super(dialect);
    }

    @Override
    protected List<OrderByElement> addOrderByElements(List<OrderItem> orderList, List<OrderByElement> orderByElements) {
        List<OrderByElement> additionalOrderBy = orderList.stream()
                .filter(item -> StringUtils.isNotBlank(item.getColumn()))
                .map(item -> {
                    OrderByElement element = new OrderByElement();
                    String column = item.getColumn();
                    // 正则匹配，抛出自定义异常
                    if (ReUtil.isMatch(regEx, column)) {
                        throw new RuntimeException("条件异常，请检查筛选条件是否存在特殊字符");
                    }
                    // 关键字匹配，抛出自定义异常
                    String lowerCase = column.toLowerCase();
                    for (String key : keySet) {
                        if (lowerCase.contains(key)) {
                            throw new RuntimeException("条件异常，请检查筛选条件是否存在特殊字符");
                        }
                    }
                    element.setExpression(new Column(column));
                    element.setAsc(item.isAsc());
                    element.setAscDescPresent(true);
                    return element;
                }).collect(Collectors.toList());
        if (CollectionUtils.isEmpty(orderByElements)) {
            return additionalOrderBy;
        }
        orderByElements.addAll(additionalOrderBy);
        return orderByElements;
    }

    @Override
    public String concatOrderBy(String originalSql, List<OrderItem> orderList) {
        try {
            Select select = (Select) CCJSqlParserUtil.parse(originalSql);
            SelectBody selectBody = select.getSelectBody();
            if (selectBody instanceof PlainSelect) {
                PlainSelect plainSelect = (PlainSelect) selectBody;
                List<OrderByElement> orderByElements = plainSelect.getOrderByElements();
                List<OrderByElement> orderByElementsReturn = addOrderByElements(orderList, orderByElements);
                plainSelect.setOrderByElements(orderByElementsReturn);
                return select.toString();
            } else if (selectBody instanceof SetOperationList) {
                SetOperationList setOperationList = (SetOperationList) selectBody;
                List<OrderByElement> orderByElements = setOperationList.getOrderByElements();
                List<OrderByElement> orderByElementsReturn = addOrderByElements(orderList, orderByElements);
                setOperationList.setOrderByElements(orderByElementsReturn);
                return select.toString();
            } else if (selectBody instanceof WithItem) {
                // todo: don't known how to resole
                return originalSql;
            } else {
                return originalSql;
            }
        } catch (JSQLParserException e) {
            logger.warn("failed to concat orderBy from IPage, exception:\n" + e.getCause());
        } catch (RuntimeException e) {
            throw new RuntimeException(e.getMessage());
        } catch (Exception e) {
            logger.warn("failed to concat orderBy from IPage, exception:\n" + e);
        }
        return originalSql;
    }
}

