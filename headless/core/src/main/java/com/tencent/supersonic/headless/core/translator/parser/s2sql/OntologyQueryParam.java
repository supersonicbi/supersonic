package com.tencent.supersonic.headless.core.translator.parser.s2sql;

import com.google.common.collect.Sets;
import com.tencent.supersonic.common.pojo.ColumnOrder;
import com.tencent.supersonic.headless.api.pojo.enums.AggOption;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class OntologyQueryParam {
    private Set<String> metrics = Sets.newHashSet();
    private Set<String> dimensions = Sets.newHashSet();
    private String where;
    private Long limit;
    private List<ColumnOrder> order;
    private boolean nativeQuery = false;
    private AggOption aggOption = AggOption.DEFAULT;
}