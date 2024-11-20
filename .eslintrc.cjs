const { getESLintConfig } = require('@applint/spec');

module.exports = getESLintConfig(
  'common-ts',
    {
        rules: {
            '@typescript-eslint/no-loop-func': 0,
            '@typescript-eslint/no-use-before-define': ['error'],
            'no-shadow': ['off'],
            'block-no-empty': 0,
            'guard-for-in': 0,
            '@typescript-eslint/no-non-null-asserted-optional-chain': 0,
            '@typescript-eslint/no-explicit-any': ['off'],
            '@typescript-eslint/ban-types': ['off'],
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-empty-interface': [
                'off',
                {
                    allowSingleExtends: false,
                },
            ],
            'react/jsx-filename-extension': [
                0,
                {
                    extensions: ['.tsx'],
                },
            ], // 引入文件扩展
            'id-length': 0,
            'no-restricted-globals': 0,
            '@typescript-eslint/prefer-for-of': 0,
            '@typescript-eslint/ban-ts-comment': 0,
            '@typescript-eslint/no-unused-expressions': 0,
            'no-plusplus': ['off'], // 允许使用++运算符
            'class-methods-use-this': ['off'], // 在class中，不必将没有使用this的方法转换成静态方法
            'func-names': ['off'], // 允许匿名函数
            'object-curly-newline': ['off'],
            // 'react/jsx-indent': ['error', 4], // 统一jsx标签的缩进
            // 'react/jsx-indent-props': ['error', 2], // 统一jsx属性的缩进
            'react/jsx-props-no-spreading': ['off'], // 不禁止jsx上使用解构
            'react/static-property-placement': [0], // 统一静态属性的位置
            'react/destructuring-assignment': [
                'off',
                'always',
                {
                    ignoreClassFields: true,
                },
            ], // 使用解构语法， 类的属性除外
            'react/state-in-constructor': ['off'], // state不需要放到constructor
            'jsx-a11y/click-events-have-key-events': ['off'], // 取消点击事件必须加key事件
            'jsx-a11y/no-noninteractive-element-interactions': ['off'], // 取消非互动元素必须添加role属性
            'jsx-a11y/no-static-element-interactions': ['off'], // 取消必须添加role熟悉感
            'jsx-a11y/label-has-associated-control': ['off'],
            'jsx-a11y/control-has-associated-label': ['off'],
            camelcase: ['off'],
            'react/jsx-no-bind': ['off'],
            eqeqeq: [0],
            'consistent-return': ['off'],
            'react/jsx-boolean-value': ['off'],
            'react/prop-types': ['off'],
            'no-use-before-define': 0,
            'react/require-default-props': ['off'],
            'no-case-declarations': 'off',
            'react/button-has-type': 'off',
            /**
             *  推荐使用表达式?.()
             */
            'no-unused-expressions': 'off',
            /**
             * 消除未使用的变量、函数和函数参数。
             */
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 0,
            "react-hooks/rules-of-hooks": 'off'
        }
    }
);
